# Stremio - Freedom to Stream

[![Build](https://github.com/Stremio/stremio-web/actions/workflows/build.yml/badge.svg)](https://github.com/Stremio/stremio-web/actions/workflows/build.yml)
[![Github Page](https://img.shields.io/website?label=Page&logo=github&up_message=online&down_message=offline&url=https%3A%2F%2Fstremio.github.io%2Fstremio-web%2F)](https://stremio.github.io/stremio-web/development)

## What is Stremio?

Stremio is a modern media center that's a one-stop solution for your video entertainment. You discover, watch and organize video content from easy to install addons.

## What is Stremio Neo?

A fork of Stremio web that aims to add new UI and features without touching the stremio core, allowing for faster updates and independent development.

## Download (Experimental)

<div align="center">

[![Web](https://img.shields.io/badge/Web-Use%20Online-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://stremio-neo.aayushcodes.eu/) [![Windows](https://img.shields.io/badge/Windows-Download-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/aayushrautela/stremio-shell-ng/releases/download/v5.0.15/StremioSetup-v5.0.15.exe) [![Linux](https://img.shields.io/badge/Linux-Very%20Soon-FFA500?style=for-the-badge&logo=linux&logoColor=white)](#) [![Mac](https://img.shields.io/badge/Mac-Soon-000000?style=for-the-badge&logo=apple&logoColor=white)](#)

</div>

> **Note:** Currently, the Windows installer will replace the original Stremio installation.

## Features

1. **All the good stuff from Stremio**: Everything you love about Stremio, preserved and enhanced
2. **New Home Screen**: Redesigned board with new Hero section and Continue watching section
3. **Discover**: Enhanced discovery with advanced filters and a quick info popup
4. **Calendar**: Keep track of upcoming releases and manage your viewing schedule
5. **More Detailed Movie Description**: Richer metadata (TMDB) and information for every title
6. **Catalog Management (Finally)**: Only see the lists that matter to you
7. **Upcoming**: Better mobile UI, more ratings, auto-play. Open to suggestions.

## Screenshots

### Board

![Board](/screenshots/board.png)

### Discover

![Discover](/screenshots/discover.png)

### Details

![Details](/screenshots/details.png)

### Calendar

![Calendar](/screenshots/calendar.png)

### Extra Settings

![Settings](/screenshots/settings.png)

---

## Build

### Prerequisites

* Node.js 12 or higher
* [pnpm](https://pnpm.io/installation) 10 or higher

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
pnpm start
```

### Production build

```bash
pnpm run build
```

### Run with Docker

```bash
docker build -t stremio-web .
docker run -p 8080:8080 stremio-web
```

## License

Stremio is copyright 2017-2023 Smart code and available under GPLv2 license. See the [LICENSE](/LICENSE.md) file in the project for more information.
