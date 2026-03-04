#!/usr/bin/env zsh
# run.sh — Run Ansible playbook with correct config
# Usage: ./run.sh [--tags dock] [--check] [any ansible-playbook args]

set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "$0")" && pwd)"

ANSIBLE_CONFIG="$DOTFILES_DIR/ansible/ansible.cfg" \
ansible-playbook "$DOTFILES_DIR/ansible/site.yml" \
    -i "$DOTFILES_DIR/ansible/inventory.yml" \
    --limit "${LIMIT:-macos}" \
    "$@"
