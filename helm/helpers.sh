#!/bin/bash

check_kube_context() {
  partial="$1"
  context=$(kubectl config current-context)
  echo $partial
  echo $context
  if [[ $context == *"$partial"* ]]; then
    return 0
  fi

  return 1
}
