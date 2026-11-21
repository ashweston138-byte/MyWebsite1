# Supabase Auth setup

The sign-in page uses Supabase Auth for email/password accounts. Supabase stores and verifies credentials; this static site does not run its own server.

## Connect a Supabase project

1. Create a project in Supabase and enable the Email provider under **Authentication**.
2. In the project's API settings, copy the project URL and its **publishable** key (or legacy `anon` key) into `supabase-config.js`.
   - `url` should look like `https://your-project-id.supabase.co`.
   - `publishableKey` is intended for browser use. Never put a `service_role` or secret key in this file.
3. In **Authentication > URL Configuration**, add the local sign-in URL to the allowed redirect URLs, for example `http://localhost:8000/login.html`. Add your deployed sign-in URL before launching the site.
4. From the project folder, serve the site over HTTP rather than opening `login.html` as a `file://` URL. For example, run `python -m http.server 8000` and visit `http://localhost:8000/login.html`.
5. Use **Create an account** to register with an email address. If email confirmation is enabled, follow the link sent by Supabase before signing in. Configure a production email provider in Supabase before relying on confirmation emails.

The page supports account creation, sign-in, session persistence, and sign-out. Authentication does not restrict access to any pages; the rest of the website remains public. Never expose a service-role key in browser code.

## Set up plant favorites

1. Open the Supabase project's **SQL Editor**.
2. Copy the contents of `supabase-favorites.sql` into a new query and run it. It creates the `plant_favorites` table, enables Row Level Security, allows authenticated users to read, add, or remove only their own favorites, and refreshes the REST API schema cache. It is safe to rerun if the table is not yet visible to the website.
3. Sign in on the website. The collection cards will show **Save to favorites** buttons; saved choices persist in the Supabase account.

The favorites table is separate from authentication and does not make the rest of the site private. Never expose a service-role key in browser code.

## Set up community comments and photo finds

The comments panel uses Giscus and the repository's GitHub Discussions **Announcements** category. The repository must be public, Discussions must be enabled, and the Giscus GitHub App must be installed for comments to load and accept posts. Install the app for this repository at <https://github.com/apps/giscus/installations/new>.

The community photo gallery uses the Supabase project above:

1. Open the Supabase project's **SQL Editor**.
2. Run `supabase-community.sql`. It creates a public gallery for reading and a public Storage bucket for images. Only signed-in users can upload; each uploaded image appears in the gallery immediately.
3. Visitors can view the gallery without signing in. Photos must be JPG, PNG, WebP, or GIF and no larger than 5 MB. Captions are limited to 180 characters.

Gallery images are publicly readable. The SQL policies restrict uploads to a user's own storage folder and keep account identifiers out of the public photo query. Never put a Supabase service-role or secret key in browser code.
