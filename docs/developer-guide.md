# Developer Guidelines

This repository follows the best practices and the conventions of the open-source community
to keep the development process consistent and secure.

## Connecting to GitHub with SSH

It is recommended to use an SSH key to interact with GitHub repositories over username & password plain authentication method.

- see https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent

## GPG key signing

It is recommended to sign Git commits using a GPG key to get the commits verified.

- see https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification/signing-commits
- see https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification/adding-a-new-gpg-key-to-your-github-account

## Setting up the local development environment

- [`asdf`](https://asdf-vm.com/#/core-manage-asdf) is a tool to manage multiple runtime versions with a single CLI tool.
- The tools defined in [.tool-verions](../.tool-verions) are managed by `asdf`.

### Installation

1. Install `asdf` according to the `asdf` installation guide.
   - https://asdf-vm.com/#/core-manage-asdf?id=install
1. Install `asdf` tools defined in [.tool-verions](../.tool-verions).

   ```sh
      cat .tool-versions | cut -f 1 -d ' ' | xargs -n 1 asdf plugin-add || true
      asdf plugin-update --all
      asdf install
      asdf reshim
   ```

1. Install `pip` with python.

   ```sh
      curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
      python get-pip.py
   ```

1. Install Python packages with `pip`.

   ```sh
      pip install -r requirements.txt
   ```

1. Setup git pre-commit hooks.

   ```sh
      pre-commit install
      gitlint install-hook
   ```

## Code style and Linting

We use [Terraform fmt](https://www.terraform.io/docs/cli/commands/fmt.html) to format Terraform scripts and [Prettier](https://prettier.io/) to format javascript codebase.

## Pre-commit

`pre-commit` is set-up in the repository, helping to enforce code-quality and security automatically, and it will check for following:

- Detect unnecessary spaces and new lines.
- Validate Terraform scripts' formats and logic.
- Ensure that the commit messages meet the standard `conventional-commit`.

  - https://www.conventionalcommits.org/en/v1.0.0/#summary

- To add pre-commit hook in .git:

  ```sh
     pre-commit install
  ```

- To run pre-commit against all files in the repo:

  ```sh
     pre-commit run --all-files
  ```

See the [.pre-commit-config.yaml](../.pre-commit-config.yaml) file for full list of hooks in use.

## CI/CD pipelines

To integrate code into a shared repository and run Terraform scripts continuously, we use Github Actions pipelines.
The major workflows are:

1. `pre-commit`: runs `pre-commit` hooks to ensure the code-quality meets the standard.

- For more details, see [.github/workflows](../.github/workflows) directory.
