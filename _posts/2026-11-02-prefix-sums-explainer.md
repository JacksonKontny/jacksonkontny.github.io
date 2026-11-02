---
layout: post
title: Prefix sums, from O(1) range queries to parallel scans
---

Why does `sum(i..j) = prefix[j+1] - prefix[i]` work, why does a running sum resist SIMD, and how do the Hillis-Steele and Blelloch scans build the prefix array in parallel anyway?

This one is an interactive explainer: step through both parallel scans on the same eight numbers, watch the addition counts pile up, and test yourself along the way. About 15 minutes.

**[Read the explainer →]({{ site.baseurl }}/prefix-sums/)**
