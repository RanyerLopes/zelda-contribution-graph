# Profile README snippet

Paste this into your `README.md` (on your `<username>/<username>` GitHub profile repo)
to embed the animated graph. The `<picture>` tag makes it theme-aware:

```html
<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_GITHUB_USERNAME/output/zelda-contribution-graph.svg"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_GITHUB_USERNAME/output/zelda-contribution-graph-light.svg"
  />
  <img
    alt="Zelda Contribution Graph"
    src="https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_GITHUB_USERNAME/output/zelda-contribution-graph.svg"
  />
</picture>
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.
