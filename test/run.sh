#!/usr/bin/env bash

EXIT_STATUS=0

for file in $@; do
  node --expose_gc $file
  result=$?
  printf "\033[90m   ${file#test/}\033[0m "
  if [ $result -eq 0 ]; then
    printf "\033[36m✓\033[0m\n"
  else
    printf "\033[31m✗\033[0m\n"
    EXIT_STATUS=$result
  fi
done

exit $EXIT_STATUS
