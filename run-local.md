# Running the private tools

`admin.html` and `studio.html` are **not published**. Keep them in this folder,
outside the website repository, and run them from your own machine.

## Start (once per session)

From this folder:

    python3 -m http.server 8787

Then open:

- Administration console — http://localhost:8787/admin.html
- Writing studio         — http://localhost:8787/studio.html

Stop it with Ctrl+C when you're finished.

## One-time Supabase setting

Sign-in has to be allowed to return to your machine.
Supabase → **Authentication → URL Configuration** → add to *Redirect URLs*:

    http://localhost:8787
    http://localhost:8787/*

Leave *Site URL* pointing at the public site. Both work at the same time.

## Sharing with the other authors

Send them this folder (or just `studio.html` plus these instructions) through a
private channel. They run the same two commands. Nothing about the tools needs
to exist on the public website for them to work — every action goes straight to
the database, and the database decides what each account may do.

## If you would rather host them anyway

They can be published, but treat the code as readable by anyone who finds the
URL. In that case:

- give them unguessable names, e.g. `console-9f3ac71.html`, and link them from
  nowhere;
- keep the `noindex, nofollow` tags they already carry;
- rely on what actually protects the data: the master role check, the admin PIN,
  the `can_publish` flag and the row-level security policies.
