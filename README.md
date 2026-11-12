## About this fork

This is UNSW Research Technology Services' fork of [Open Composer](https://github.com/OpenOnDemandJP/OpenComposer), based on upstream release `v2.0.2`. It runs the [IRIS](https://docs.restech.unsw.edu.au/iris/) imaging workflows on Katana OnDemand, and other platforms can install the same code with their own `conf.yml.erb`.

- **Upstream releases only.** Upstream release tags are merged on purpose, one at a time, after this fork's browser tests pass on the merge. The fork never tracks upstream `main` or `develop`.
- **Generic code, platform in config.** Nothing in the code names IRIS. Each platform sets its own name and catalogue link through the branding keys below.
- **Tests.** CI runs upstream's smoke tests (`misc/tests/run_tests.rb`) unchanged, and the fork's browser tests (`misc/tests/browser/`), which start Open Composer on test forms and drive the page in headless Chromium with Playwright. `misc/tests/README.md` says how to run both.

### Branding keys

Both are optional. Unset, the page looks as it does upstream.

| Key | Effect | IRIS sets |
|---|---|---|
| `platform_name` | Shown as text at the left of the navbar, and in the tab title, as `<form> \| <platform_name>` in place of `<form> \| Open Composer` | `IRIS` |
| `catalogue_url` | Adds a **Catalogue** link to the navbar, opening the platform's catalogue in a new tab | `https://docs.restech.unsw.edu.au/iris/` |

### Field-owned lines

Changing a widget rewrites only the lines of the script and submit panes that hold its variables, so a user's edits to every other line are kept. Upstream regenerates the whole pane, behind an `overwrite_warning` modal ("Discard and continue"); the fork drops that modal and the setting. The pane's record of which line came from which template line, and so which widgets it holds, is described at `ocForm.panes` in `public/form.js`.

### Locked lines

A line holding a widget's variable is locked, so the form, `check:` and the submitted script always agree: it is shaded, and an edit that would change, join, split or remove it is undone, while lines can still be added before and after it. Hovering a locked line shows "Set by" and the widget's label (`Set by Hours and Minutes` for a line holding two), and clicking it focuses the widget. Upstream lets these lines be edited; a reverse update from the edited line to the widget (upstream PR #37's second feature) is not offered, since a line such as `#{time_1}:#{zeropadding(time_2, 2)}` can't always be read back. A segment can also be locked with no widget, `fixed` in `ocForm.templateLine` in `public/form.js`, and then shows "Fixed by the form".

### Text contrast

Text on the navbar, its dropdown menus, the footer, the home page's category headings and the description banners of the form and history pages is black or white, whichever contrasts more with the background colour the config sets for it (WCAG relative luminance). Upstream hard-codes white, which is unreadable on a light colour such as Katana OnDemand's yellow. The rule reads colours written as `#RGB`, `#RRGGBB` (either with alpha) or `rgb()`; any other colour keeps white text. Upstream's default colours are dark, so they still get white.

### Submit bar

The form page's one Submit button (Confirm or Save, when the form's action is one of those) sits in a bar across the bottom of the form that stays at the bottom of the window while any of the form is on screen, so it is in reach from the first field, the middle of the script pane and the end of the page. Upstream puts it below the script pane, out of sight on a long form.

## Overview

Open Composer is a web application to generate batch job scripts and submit batch jobs for HPC clusters on [Open OnDemand](https://openondemand.org/).

Open Composer is an Open OnDemand app in the "Jobs"
category. Unlike Batch Connect interactive apps, Open Composer provides a graphical
interface for creating, previewing, editing, and submitting batch job scripts. It
supports multiple job schedulers and can be configured for different HPC applications.

- **App type:** Workflow Composer (Jobs category)
- **Latest release:** [`v2.0.2`](https://github.com/RIKEN-RCCS/OpenComposer/releases/tag/v2.0.2) (see [Changelog](https://github.com/RIKEN-RCCS/OpenComposer/blob/main/CHANGELOG.md))
- **License:** MIT (see [LICENSE file](https://github.com/RIKEN-RCCS/OpenComposer/blob/main/LICENSE))
- **Requirements:** Open OnDemand 3.0 or later.
- **Supported job schedulers:** Slurm, PBS Pro, Grid Engine, Fujitsu TCS
- **Features**
  - Graphical web interface for generating and submitting batch job scripts
  - Multi-scheduler and multi-cluster support
  - Job history page with filtering, status tracking, and job cancellation
  - Editable job script preview before submission
  - Configurable application forms via `form.yml`
  - Dynamic form widgets with conditional visibility and validation
  - Support for preprocessing steps via submit sections
  - Customizable per-application headers and labels
  - Path selector widget for file and directory selection
  - Bilingual documentation (English and Japanese)

## Screenshots

### Home page
  <img width="600" style="border: 1px solid #333;" alt="Home" src="https://riken-rccs.github.io/OpenComposer/docs/img/home_page.png">

### Application page
  <img width="600" style="border: 1px solid #333;" alt="Application" src="https://riken-rccs.github.io/OpenComposer/docs/img/application_page.png">

### History page
  <img width="600" style="border: 1px solid #333;" alt="History" src="https://riken-rccs.github.io/OpenComposer/docs/img/history_page.png">

## Documents

You can access the full documentation below:

<table>
  <tr>
    <td>Installation for administrator</td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/install.html" target="_blank">EN</a></td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/install_ja.html" target="_blank">JA</a>
  </tr>
  <tr>
    <td>Application Settings for administrator</td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/application.html" target="_blank">EN</a></td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/application_ja.html" target="_blank">JA</a></td>
  </tr>
  <tr>
    <td>User Manual</td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/manual.html" target="_blank">EN</a></td>
    <td><a href="https://riken-rccs.github.io/OpenComposer/docs/manual_ja.html" target="_blank">JA</a></td>
  </tr>
</table>

### Quick start

The following steps assume you have administrator privileges.
If you do not have administrator privileges, see [Section 4. "Installation by general user" in installation document](https://riken-rccs.github.io/OpenComposer/docs/install.html#general).

```sh
$ cd /var/www/ood/apps/sys/
$ sudo git clone https://github.com/RIKEN-RCCS/OpenComposer.git
$ cd OpenComposer
$ sudo cp conf.yml.erb.sample conf.yml.erb
```

You need to edit `conf.yml.erb`. For details, see [Section 2. "Setting" in installation manual](https://riken-rccs.github.io/OpenComposer/docs/install.html#setting).

## Testing

| System      | Site        | Scheduler          | Repository                                        |
|-------------|-------------|--------------------|---------------------------------------------------|
| Fugaku      | RIKEN RCCS  | Fujitsu TCS, Slurm | https://github.com/RIKEN-RCCS/composer_fugaku     |
| R-CCS Cloud | RIKEN RCCS  | Slurm              | https://github.com/RIKEN-RCCS/composer_rccs_cloud |
| RIKYU       | RIKEN RCCS  | Slurm              | https://github.com/RIKEN-RCCS/composer_rikyu      |

## Contributing

For discussions, see the [GitHub Discussions](https://github.com/RIKEN-RCCS/OpenComposer/discussions).

## Troubleshooting

For bugs or feature requests, [open an issue](https://github.com/RIKEN-RCCS/OpenComposer/issues) with detailed logs and reproduction steps.

## Reference
If you use this software in your research or development work, please cite the following publication:

> Masahiro Nakao and Keiji Yamamoto. 2025. ``Open Composer: A Web-Based Application for Generating and Managing Batch Jobs on HPC Clusters''. In Proceedings of the SC '25 Workshops of the International Conference for High Performance Computing, Networking, Storage and Analysis (SC Workshops '25). Association for Computing Machinery, New York, NY, USA, 697-704. https://doi.org/10.1145/3731599.3767428

## Presentation
- [HUST: International Workshop on HPC User Support Tools](https://hust-workshop.github.io), St. Louis, USA, Nov. 2025 [[Paper](https://doi.org/10.1145/3731599.3767428)] [[Slide](https://www.mnakao.net/data/2025/HUST2025.pdf)]
- [SupercomputingAsia 2025](https://sca25.sc-asia.org/), Singapore, Mar. 2025 [[Poster](https://mnakao.net/data/2025/sca.pdf)]
- [The 197th HPC Research Symposium](https://www.ipsj.or.jp/kenkyukai/event/arc251hpc197.html), Fukuoka, Japan, Dec. 2024 [[Paper](https://mnakao.net/data/2024/HPC197.pdf)] [[Slide](https://mnakao.net/data/2024/HPC197-slide.pdf)] (Japanese)

## Known limitations

No major limitations are currently known.

## Acknowledgments

The authors thank the Open OnDemand community for providing a robust ecosystem for HPC web applications.
Development of Open Composer has been carried out at [RIKEN R-CCS](https://www.r-ccs.riken.jp/en/), with significant contributions from [RIST](https://www.rist.or.jp/ehome.html).
