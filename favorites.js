const favoriteButtons = [...document.querySelectorAll("[data-favorite-toggle]")];
const favoritesStatus = document.querySelector("#favorites-status");

if (favoriteButtons.length && favoritesStatus) {
  const savedFavoriteIds = new Set();
  let supabaseClient;
  let activeUserId = null;
  let favoritesReady = false;
  let loadSequence = 0;

  const setStatus = (message, state = "info") => {
    favoritesStatus.textContent = message;
    favoritesStatus.dataset.state = state;
  };

  const showSignInPrompt = () => {
    favoritesStatus.replaceChildren(
      document.createTextNode("Sign in to save favorites. ")
    );
    const signInLink = document.createElement("a");
    signInLink.href = "login.html";
    signInLink.textContent = "Sign in";
    favoritesStatus.append(signInLink);
    favoritesStatus.dataset.state = "info";
  };

  const renderButtons = () => {
    favoriteButtons.forEach((button) => {
      const card = button.closest("[data-favorite-id]");
      const isSaved = savedFavoriteIds.has(card.dataset.favoriteId);
      button.hidden = !favoritesReady;
      button.disabled = !favoritesReady || button.dataset.saving === "true";
      button.setAttribute("aria-pressed", String(isSaved));
      button.textContent = isSaved ? "Saved to favorites" : "Save to favorites";
    });
  };

  const loadFavorites = async (session) => {
    const sequence = ++loadSequence;
    activeUserId = session ? session.user.id : null;
    favoritesReady = false;
    savedFavoriteIds.clear();
    renderButtons();

    if (!session) {
      showSignInPrompt();
      return;
    }

    setStatus("Loading your saved favorites...");

    try {
      const { data, error } = await supabaseClient
        .from("plant_favorites")
        .select("item_id")
        .eq("user_id", session.user.id);

      if (error) {
        throw error;
      }
      if (!Array.isArray(data)) {
        throw new Error("Supabase returned an invalid favorites list.");
      }
      if (sequence !== loadSequence) {
        return;
      }

      data.forEach((favorite) => savedFavoriteIds.add(favorite.item_id));
      favoritesReady = true;
      renderButtons();
      setStatus("Your favorites are saved to your account.", "success");
    } catch (error) {
      console.error("Could not load favorites:", error);
      if (sequence === loadSequence) {
        activeUserId = null;
        setStatus(
          "Could not load favorites. Check the Supabase table setup and your connection.",
          "error"
        );
      }
    }
  };

  favoriteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = activeUserId;
      const card = button.closest("[data-favorite-id]");
      const itemId = card.dataset.favoriteId;
      if (!userId || !favoritesReady) {
        return;
      }

      const isSaved = savedFavoriteIds.has(itemId);
      button.dataset.saving = "true";
      button.disabled = true;
      button.textContent = isSaved ? "Removing..." : "Saving...";

      try {
        const result = isSaved
          ? await supabaseClient
              .from("plant_favorites")
              .delete()
              .eq("user_id", userId)
              .eq("item_id", itemId)
          : await supabaseClient
              .from("plant_favorites")
              .insert({ user_id: userId, item_id: itemId });

        if (result.error) {
          throw result.error;
        }

        if (activeUserId === userId) {
          if (isSaved) {
            savedFavoriteIds.delete(itemId);
            setStatus("Favorite removed.");
          } else {
            savedFavoriteIds.add(itemId);
            setStatus("Favorite saved to your account.", "success");
          }
        }
      } catch (error) {
        console.error("Could not update favorite:", error);
        if (activeUserId === userId) {
          setStatus(
            "Could not update your favorite. Check the Supabase table setup and your connection.",
            "error"
          );
        }
      } finally {
        delete button.dataset.saving;
        renderButtons();
      }
    });
  });

  const initializeFavorites = async () => {
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
      setStatus("Supabase is not configured for favorites.", "error");
      return;
    }

    try {
      const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );
      supabaseClient = createClient(config.url, config.publishableKey);
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        void loadFavorites(session);
      });

      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        throw error;
      }
      await loadFavorites(data.session);
    } catch (error) {
      console.error("Could not initialize favorites:", error);
      setStatus(
        "Could not connect to Supabase. Check your project configuration and connection.",
        "error"
      );
    }
  };

  initializeFavorites();
}
