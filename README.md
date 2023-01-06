# ScaleMates Scraper

The [ScaleMates](https://scalemates.com) forum website is a great resource for finding scale model kits for sale or to swap.  
It is however difficult to find the people in a country who have on offer a stash of the kind of models you are looking for.

This script scrapes the website and creates an `html` file listing links to 'For Sale' pages with the number of models matching select criteria options.

## Options

The default options are in the `defaultOptions.json` file.  
Override the default options by copying it to `customOptions.json` and modifying it to suite.

## Usage

with Node.js 19^

```
git clone https://github.com/citkane/scaleMates.git
cd scaleMates
npm i
npm run scrape
```

Running the script will output `.html` files in the `build` directory.

## Example

Open `example.html` in the `build` folder for an example output.
