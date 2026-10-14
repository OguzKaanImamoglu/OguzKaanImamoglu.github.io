# Personal site

Plain HTML, CSS and JavaScript. No build step.

- `index.html`: home page
- `thesis.html`: master's thesis case study
- `palamedes.html`: Palamedes Arena project page
- `static/`: Bulma and Nerfies styles, scripts, images, PDFs

## Deploy on GitHub Pages

1. Create a public repository named `<your-username>.github.io`.
2. Push the contents of this folder to the `main` branch.
3. In the repository, open Settings, then Pages, and set the source to `main` / root.
4. The site is live at `https://<your-username>.github.io` after a minute or two.

## Preview locally

    python3 -m http.server 8000

Then open http://localhost:8000.

## Custom domain (oguzkaanimamoglu.com)

1. In the repository, open Settings, then Pages, and enter `oguzkaanimamoglu.com` under Custom domain. GitHub adds a `CNAME` file for you.
2. At your domain registrar, point the domain to GitHub Pages: four A records for `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a CNAME record for `www` pointing to `<your-username>.github.io`.
3. Once DNS has propagated, tick "Enforce HTTPS".

## Credits

Layout adapted from the [Nerfies project page](https://github.com/nerfies/nerfies.github.io) (CC BY-SA 4.0). Keep the credit line in the footer.
