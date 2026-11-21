const photoForm = document.querySelector("#community-photo-form");
const photoSignIn = document.querySelector("#community-photo-signin");
const photoFileInput = document.querySelector("#community-photo-file");
const photoCaptionInput = document.querySelector("#community-photo-caption");
const photoUploadStatus = document.querySelector("#community-photo-status");
const photoGallery = document.querySelector("#community-photo-gallery");
const photoGalleryStatus = document.querySelector("#community-photo-gallery-status");

const photoBucket = "community-finds";
const maxPhotoSize = 5 * 1024 * 1024;
const photoExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

if (
  photoForm &&
  photoSignIn &&
  photoFileInput &&
  photoCaptionInput &&
  photoUploadStatus &&
  photoGallery &&
  photoGalleryStatus
) {
  let supabaseClient;
  let activeUserId = null;
  let photoLoadSequence = 0;

  const setUploadStatus = (message, state = "info") => {
    photoUploadStatus.textContent = message;
    photoUploadStatus.dataset.state = state;
  };

  const setGalleryStatus = (message, state = "info") => {
    photoGalleryStatus.textContent = message;
    photoGalleryStatus.dataset.state = state;
  };

  const renderUploadAccess = (session) => {
    activeUserId = session ? session.user.id : null;
    photoForm.hidden = !activeUserId;
    photoSignIn.hidden = Boolean(activeUserId);
  };

  const createPhotoCard = (photo) => {
    if (
      typeof photo.object_path !== "string" ||
      typeof photo.caption !== "string" ||
      typeof photo.created_at !== "string"
    ) {
      throw new Error("Supabase returned an invalid community photo.");
    }

    const { data } = supabaseClient.storage.from(photoBucket).getPublicUrl(photo.object_path);
    if (!data || typeof data.publicUrl !== "string") {
      throw new Error("Supabase returned an invalid community photo URL.");
    }

    const card = document.createElement("article");
    card.className = "community-photo-card";

    const image = document.createElement("img");
    image.src = data.publicUrl;
    image.alt = photo.caption;
    image.loading = "lazy";
    image.decoding = "async";
    card.append(image);

    const copy = document.createElement("div");
    copy.className = "community-photo-card-copy";

    const caption = document.createElement("p");
    caption.textContent = photo.caption;
    copy.append(caption);

    const date = new Date(photo.created_at);
    const time = document.createElement("time");
    if (Number.isNaN(date.getTime())) {
      time.textContent = "Recently shared";
    } else {
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    copy.append(time);
    card.append(copy);
    return card;
  };

  const loadPhotos = async () => {
    const sequence = ++photoLoadSequence;
    photoGallery.setAttribute("aria-busy", "true");
    setGalleryStatus("Loading community finds…");

    try {
      const { data, error } = await supabaseClient
        .from("community_photos")
        .select("id, object_path, caption, created_at")
        .order("created_at", { ascending: false })
        .limit(48);

      if (error) {
        throw error;
      }
      if (!Array.isArray(data)) {
        throw new Error("Supabase returned an invalid community photo list.");
      }
      if (sequence !== photoLoadSequence) {
        return;
      }

      photoGallery.replaceChildren();
      if (!data.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "community-photo-empty";
        emptyMessage.textContent = "No finds shared yet. Be the first to add one.";
        photoGallery.append(emptyMessage);
      } else {
        data.forEach((photo) => photoGallery.append(createPhotoCard(photo)));
      }
      setGalleryStatus("");
    } catch (error) {
      console.error("Could not load community photos:", error);
      if (sequence === photoLoadSequence) {
        setGalleryStatus(
          "Could not load community finds. Check the Supabase community setup and your connection.",
          "error"
        );
      }
    } finally {
      if (sequence === photoLoadSequence) {
        photoGallery.setAttribute("aria-busy", "false");
      }
    }
  };

  photoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userId = activeUserId;
    const file = photoFileInput.files && photoFileInput.files[0];
    const caption = photoCaptionInput.value.trim();
    const submitButton = photoForm.querySelector('button[type="submit"]');

    if (!supabaseClient || !userId) {
      setUploadStatus("Sign in again before sharing a photo.", "error");
      return;
    }
    if (!file) {
      setUploadStatus("Choose a photo to share.", "error");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(photoExtensions, file.type)) {
      setUploadStatus("Choose a JPG, PNG, WebP, or GIF image.", "error");
      return;
    }
    if (file.size > maxPhotoSize) {
      setUploadStatus("Choose an image that is 5 MB or smaller.", "error");
      return;
    }
    if (!caption || caption.length > 180) {
      setUploadStatus("Add a short caption of up to 180 characters.", "error");
      return;
    }
    if (!window.crypto || typeof window.crypto.randomUUID !== "function") {
      setUploadStatus("Use a current browser over HTTPS to share a photo.", "error");
      return;
    }

    const filePath = `${userId}/${window.crypto.randomUUID()}.${photoExtensions[file.type]}`;
    submitButton.disabled = true;
    setUploadStatus("Uploading your find…");

    try {
      const { error: uploadError } = await supabaseClient.storage
        .from(photoBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabaseClient
        .from("community_photos")
        .insert({ user_id: userId, object_path: filePath, caption });

      if (insertError) {
        const { error: cleanupError } = await supabaseClient.storage
          .from(photoBucket)
          .remove([filePath]);
        if (cleanupError) {
          console.error("Could not clean up an unlisted community photo:", cleanupError);
        }
        throw insertError;
      }

      photoForm.reset();
      setUploadStatus("Your find is now in the community gallery.", "success");
      await loadPhotos();
    } catch (error) {
      console.error("Could not share community photo:", error);
      setUploadStatus(
        "Could not share your photo. Check the Supabase community setup and try again.",
        "error"
      );
    } finally {
      submitButton.disabled = !activeUserId;
    }
  });

  const initializeCommunityFinds = async () => {
    const config = window.SUPABASE_CONFIG;
    if (
      !config ||
      typeof config.url !== "string" ||
      typeof config.publishableKey !== "string" ||
      !config.url.trim() ||
      !config.publishableKey.trim() ||
      config.url.includes("YOUR_PROJECT_ID") ||
      config.publishableKey.includes("YOUR_SUPABASE")
    ) {
      setGalleryStatus("Supabase is not configured for community photos.", "error");
      return;
    }

    try {
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );
      supabaseClient = createClient(config.url, config.publishableKey);
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        renderUploadAccess(session);
      });

      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        throw error;
      }

      renderUploadAccess(data.session);
      await loadPhotos();
    } catch (error) {
      console.error("Could not initialize community photos:", error);
      setGalleryStatus(
        "Could not connect to Supabase. Check your project configuration and connection.",
        "error"
      );
    }
  };

  initializeCommunityFinds();
}
