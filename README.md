# Buykori Marketing Site

This folder is the Vercel-ready marketing website for `buykori.app`.

## Deploy on Vercel

1. Create a new Vercel project from this repository.
2. Set the project root directory to `marketing-site`.
3. Select `Other` or static HTML as the framework preset.
4. Leave build command and output directory empty.
5. Add the production domain:
   - `buykori.app`
   - `www.buykori.app`

## DNS

Use the DNS values Vercel gives for `buykori.app` and `www.buykori.app`.

Keep the tracking backend separate:

```txt
api.buykori.app    -> current FastAPI backend
track.buykori.app  -> optional tracking endpoint alias
```

Client and admin portals should be moved later:

```txt
client.buykori.app -> future client portal frontend
admin.buykori.app  -> future admin portal frontend
```

## Notes

- This site is static and does not run the FastAPI backend.
- The WordPress plugin should keep sending events to the backend API domain, not to this marketing site.
- Client/admin UI should fetch data from `https://api.buykori.app` when those frontends are split out.
