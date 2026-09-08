// Compare two data directories (e.g. a saved baseline and dist/data) the way the site
// cares about: SplatNet returns object keys and some arrays in random order per request,
// and ICS files carry a per-run DTSTAMP, so byte diffs are noise. Usage:
//
//   node scripts/compare-data.mjs <baseline-dir> <current-dir>
//
// Exits non-zero when a real difference is found.

import fs from 'node:fs';
import path from 'node:path';
import stringify from 'json-stable-stringify';

const [base, current] = process.argv.slice(2);

if (!base || !current) {
    console.error('Usage: node scripts/compare-data.mjs <baseline-dir> <current-dir>');
    process.exit(2);
}

function firstDifference(a, b, at = '$') {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return `${at}.length ${a.length} vs ${b.length}`;

        // Festival result lists come back in random order
        if (a.length && a[0] && typeof a[0] === 'object' && 'festival_id' in a[0]) {
            let leftItems = a.map(item => stringify(item)).sort();
            let rightItems = b.map(item => stringify(item)).sort();

            return leftItems.every((item, index) => item === rightItems[index])
                ? null
                : `${at}: set of items differs`;
        }

        for (let i = 0; i < a.length; i++) {
            let difference = firstDifference(a[i], b[i], `${at}[${i}]`);

            if (difference)
                return difference;
        }

        return null;
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (let key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            let difference = firstDifference(a[key], b[key], `${at}.${key}`);

            if (difference)
                return difference;
        }

        return null;
    }

    return a === b ? null : `${at}: ${JSON.stringify(a)?.slice(0, 60)} vs ${JSON.stringify(b)?.slice(0, 60)}`;
}

const walk = dir =>
    fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap(entry =>
            entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
        );

let problems = 0;

for (let file of walk(base)) {
    let relative = path.relative(base, file);
    let other = path.join(current, relative);

    if (!fs.existsSync(other)) {
        console.log(`${relative}: missing in ${current}`);
        problems++;
        continue;
    }

    let a = fs.readFileSync(file);
    let b = fs.readFileSync(other);

    if (a.equals(b))
        continue;

    if (relative.endsWith('.json')) {
        let difference = firstDifference(JSON.parse(a), JSON.parse(b));

        if (difference) {
            console.log(`${relative}: ${difference}`);
            problems++;
        }
    } else if (relative.endsWith('.ics')) {
        let strip = s =>
            s
                .toString()
                .split(/\r?\n/)
                .filter(line => !line.startsWith('DTSTAMP'))
                .join('\n');

        if (strip(a) !== strip(b)) {
            console.log(`${relative}: calendar content differs`);
            problems++;
        }
    } else {
        console.log(`${relative}: binary content differs`);
        problems++;
    }
}

console.log(problems ? `${problems} real difference(s)` : 'semantically identical');
process.exit(problems ? 1 : 0);
