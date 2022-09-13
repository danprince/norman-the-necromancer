#!/usr/bin/env bash

file=$1
max_size=13312 # (13 * 1024)
size=$(ls -l "$file" | awk '{ print $5 }')
percent=$(echo "$size / $max_size * 100" | bc -l)
printf "%d/%d bytes (%.2f%%)\n" "$size" "$max_size" "$percent"
