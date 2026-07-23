# NeurIPS 2026 Workshop — AI Agents for Biomedical Imaging and Multimodal Clinical Data

Official website for the NeurIPS 2026 Workshop on AI Agents for Biomedical Imaging and
Multimodal Clinical Data, in collaboration with the [MELBA journal](https://www.melba-journal.org/).
Hosted on GitHub Pages at <https://aabi-neurips.github.io>.

## Structure

The site is a single static page — no backend, no build system.

| File | Purpose |
|------|---------|
| `index.html` | All content, organized into sections (About, Call for Papers, Dates, Speakers, Program, Organizers, Committee, Submission, Contact) |
| `styles.css` | All styling. Colors and fonts are CSS variables at the top of the file |
| `script.js` | Minimal JS — only the mobile hamburger menu |
| `images/` | Headshots (400×400 JPG), MELBA logo, and the hero background (`hero-bg.svg`) |

## How to edit

1. Open `index.html` and find the section you want to change (each section is marked
   with an HTML comment banner, e.g. `<!-- ===== Invited Speakers ===== -->`).
2. Remaining placeholders are marked with `<!-- TODO -->` comments — search for `TODO`:
   workshop date/venue, OpenReview link, contact email, program committee list.
3. To add a person, duplicate a `.person-card` block inside the `.people-grid`, add a
   400×400 photo to `images/`, and fill in name, affiliation, topic, and link.
4. Invited speakers are marked "To be confirmed" (`.person-tag`); remove that span
   once a speaker confirms.
5. To change the color scheme, edit the CSS variables at the top of `styles.css`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy

Pushing to the `main` branch automatically publishes the site via GitHub Pages
(because the repository is named `aabi-neurips.github.io`).

## Key dates currently on the site

- Call for papers released: July 2026
- Paper submission deadline: **August 29, 2026 (AoE)**
- Notification of acceptance: **no later than September 29, 2026 (AoE)**
- Public schedule posted: October 2026
- Workshop: December 2026 (exact date TBA)
- MELBA special issue submissions: target January 2027
