---
layout: post
title: js最长递增子序列
date: 2020-10-12 20:04:50
tags: [code, 算法, vue, leetcode]
categories: js
---

## vue3 DOM diff 最长递增子序列的实现

```js
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  // 数组副本
  const p = arr.slice();
  // 最后返回的序列 存储的是长度为 i 的递增子序列最小末尾值的索引
  const result = [0];

  let i, j, u, v, c;
  const len = arr.length;

  for (i = 0; i < len; i++) {
    // 保存数组第 i 项
    const arrI = arr[i];

    if (arrI !== 0) {
      // 取出现有的列表最后一个值
      j = result[result.length - 1];

      // 如果第 i-1 项小于第 i 项，就要把下标 i 排列到 result 的最后，继续下一个循环
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }

      // 否则就要挨个和前面的比较
      u = 0; // 索引（放置的索引）
      // 保存现有 result 的长度
      v = result.length - 1;

      // 利用二分查找出比 第 i 项小的值(最小差，也就是最接近) c，并把 result 的长度设为 c
      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }

      // 找到 位置 u 更新 result[u]
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }

  u = result.length;
  v = result[u - 1];

  // 回溯数组 p，找到最终的索引
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
```

## leetcode 300 最长上升子序列

给定一个无序的整数数组，找到其中最长上升子序列的长度

```
输入: [10,9,2,5,3,7,101,18]
输出: 4
解释: 最长的上升子序列是 [2,3,7,101]，它的长度是 4。
```

vue3 对应的是 O(nlogn) 的复杂度，下面写 O(n^2) 的复杂度
思路就是双层循环，动态规划
比如数组的第 i 项对应的最长子序列 就是 第 i - 1 项对应的最长子序列 + 1
[9,8,3,4,5] 的子序列长度数组就是 [1,1,1,2,3]

```js
var lengthOfLTS = function (arr) {
  const len = arr.length;
  const dp = new Array(len).fill(1);

  for (let i = 0; i < len; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[i] > arr[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
};
```
