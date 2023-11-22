In CSS app, the allowed URI syntax consists of two parts with `://` in the middle:
- `<scheme>://<path>`
- `scheme`: the following rules must be met:
    1. must be greater than one character.
    2. must start with an alphabet character followed by optional characters (`alphabets`, `hyphens(-)`, and `periods(.)`)
- `path`: a minimum of one character is required except for `white spaces` and `#`.
- For the `dev` and `test` redirect URIs please refer to the regular expression `/^[a-zA-Z][a-zA-Z-\.]*:\/\/\S+/`
- For `prod` URIs there are additional restrictions on wildcards (*) please refer to the regular expression `/^[a-zA-Z][a-zA-Z-\.]*:\/\/([^*\s]+\/\S*|[^*\s]*[^*\s]$)/`.  This prevents domain level wildcards like `https://www.example.com*` while accepting non-domain level wildcards `https://www.example.com/*`.
* We made an exception to allow wildcard (*) in the dev, and test environments to satisfy the various development processes.
