# Svelte Docset

[Dash](https://kapeli.com/dash) docset documentation generator for the [Svelte](https://svelte.dev) [SvelteKit](https://kit.svelte.dev)  JavaScript frameworks

## Prerequisites

- The [dashing](https://github.com/technosophos/dashing) generator installed in `$PATH`

## Generating the docset

1. `npm install`
2. `npm run generate` (this will both fetch & generate the docsets)

If you just want to fetch the sites, `npm run fetch`.

If you just want to (re)build the docsets, `npm run build`.

To generate a docset for just svelte or just sveltekit, use `npm run (generate|fetch|build)-(svelte|sveltekit)`

## Notes / About

This runs a Node script and uses [Puppetteer](https://github.com/puppeteer/puppeteer) to fetch a few key pages from the main Svelte site (the tutorial + main docs page) or the sveltekit docs.

It then does some light processesing to setup the pages for local access -- removes the header, makes some CSS tweaks, fixes url/href paths, etc.

[Dashing](https://github.com/technosophos/dashing) then scans the docs and generates the docset based on a healthy dose of regex matching.

## Contributions welcome!

Feel free to contribute any fixes/improvements. PRs always welcome. Ideas welcome too - just open an issue.

## Things to improve / TODOs

- [X] Add [SvelteKit](https://sapper.svelte.dev) docs (will likely be in a separate repo)
- [ ] Get scripts / REPL working.
- [ ] Recursion in `crawl()` makes fans spin.
- [ ] fonts/SVGs fail on every 3rd or 4th page. Not really a big deal since they arrive the first time around
- [ ] Refactor without Dashing to fully support TOC (a la Vue docset)

## Author

- [Noah Lehmann-Haupt](https://github.com/noahlh)
- [Julie](https://github.com/cobular)
