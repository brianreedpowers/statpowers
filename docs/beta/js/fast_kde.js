function density1d(data, options = {}) {
  const { adjust = 1, pad = 3, bins = 512 } = options;
  const x = accessor(options.x, x => x);
  const w = accessor(options.weight, () => 1 / data.length);

  let bandwidth = options.bandwidth ?? adjust * nrd(data, x);

  const [lo, hi] = options.extent ?? extent(data, x, pad * bandwidth);
  const grid = bin1d(data, x, w, lo, hi, bins);
  const delta = (hi - lo) / (bins - 1);
  const neg = grid.some(v => v < 0);

  let config = dericheConfig(bandwidth / delta, neg);
  let result;

  function* points(x = 'x', y = 'y') {
    const result = estimator.grid();
    const scale = 1 / delta;
    for (let i = 0; i < bins; ++i) {
      yield {
        [x]: lo + i * delta,
        [y]: result[i] * scale
      };
    }
  }

  const estimator = {
    [Symbol.iterator]: points,
    points,
    grid: () => result || (result = dericheConv1d(config, grid, bins)),
    extent: () => [lo, hi],
    bandwidth(_) {
      if (arguments.length) {
        if (_ !== bandwidth) {
          bandwidth = _;
          result = null;
          config = dericheConfig(bandwidth / delta, neg);
        }
        return estimator;
      } else {
        return bandwidth;
      }
    }
  };

  return estimator;
}

function nrd(data, x) {
  const values = data.map(x).filter(v => v != null && v >= v);
  values.sort((a, b) => a - b);
  const sd = jStat.stdev(values,true);
  const q1 = estimatePercentile(values, 0.25);
  const q3 = estimatePercentile(values, 0.75);

  const n = values.length,
        h = (q3 - q1) / 1.34,
        v = Math.min(sd, h) || sd || Math.abs(q1) || 1;

  return 1.06 * v * Math.pow(n, -0.2);
}

function accessor(x, fallback) {
  return x == null ? fallback
    : typeof x === 'function' ? x
    : d => d[x];
}

function dericheConfig(sigma, negative = false) {
  // compute causal filter coefficients
  const a = new Float64Array(5);
  const bc = new Float64Array(4);
  dericheCausalCoeff(a, bc, sigma);

  // numerator coefficients of the anticausal filter
  const ba = Float64Array.of(
    0,
    bc[1] - a[1] * bc[0],
    bc[2] - a[2] * bc[0],
    bc[3] - a[3] * bc[0],
    -a[4] * bc[0]
  );

  // impulse response sums
  const accum_denom = 1.0 + a[1] + a[2] + a[3] + a[4];
  const sum_causal = (bc[0] + bc[1] + bc[2] + bc[3]) / accum_denom;
  const sum_anticausal = (ba[1] + ba[2] + ba[3] + ba[4]) / accum_denom;

  // coefficients object
  return {
    sigma,
    negative,
    a,
    b_causal: bc,
    b_anticausal: ba,
    sum_causal,
    sum_anticausal
  };
}

function dericheCausalCoeff(a_out, b_out, sigma) {
  const K = 4;

  const alpha = Float64Array.of(
    0.84, 1.8675,
    0.84, -1.8675,
    -0.34015, -0.1299,
    -0.34015, 0.1299
  );

  const x1 = Math.exp(-1.783 / sigma);
  const x2 = Math.exp(-1.723 / sigma);
  const y1 = 0.6318 / sigma;
  const y2 = 1.997 / sigma;
  const beta = Float64Array.of(
    -x1 * Math.cos( y1), x1 * Math.sin( y1),
    -x1 * Math.cos(-y1), x1 * Math.sin(-y1),
    -x2 * Math.cos( y2), x2 * Math.sin( y2),
    -x2 * Math.cos(-y2), x2 * Math.sin(-y2)
  );

  const denom = sigma * 2.5066282746310007;

  // initialize b/a = alpha[0] / (1 + beta[0] z^-1)
  const b = Float64Array.of(alpha[0], alpha[1], 0, 0, 0, 0, 0, 0);
  const a = Float64Array.of(1, 0, beta[0], beta[1], 0, 0, 0, 0, 0, 0);

  let j, k;

  for (k = 2; k < 8; k += 2) {
    // add kth term, b/a += alpha[k] / (1 + beta[k] z^-1)
    b[k]     = beta[k] * b[k - 2] - beta[k + 1] * b[k - 1];
    b[k + 1] = beta[k] * b[k - 1] + beta[k + 1] * b[k - 2];
    for (j = k - 2; j > 0; j -= 2) {
      b[j]     += beta[k] * b[j - 2] - beta[k + 1] * b[j - 1];
      b[j + 1] += beta[k] * b[j - 1] + beta[k + 1] * b[j - 2];
    }
    for (j = 0; j <= k; j += 2) {
      b[j]     += alpha[k] * a[j]     - alpha[k + 1] * a[j + 1];
      b[j + 1] += alpha[k] * a[j + 1] + alpha[k + 1] * a[j];
    }

    a[k + 2] = beta[k] * a[k]     - beta[k + 1] * a[k + 1];
    a[k + 3] = beta[k] * a[k + 1] + beta[k + 1] * a[k];
    for (j = k; j > 0; j -= 2) {
      a[j]     += beta[k] * a[j - 2] - beta[k + 1] * a[j - 1];
      a[j + 1] += beta[k] * a[j - 1] + beta[k + 1] * a[j - 2];
    }
  }

  for (k = 0; k < K; ++k) {
    j = k << 1;
    b_out[k] = b[j] / denom;
    a_out[k + 1] = a[j + 2];
  }
}

function dericheConv2d(cx, cy, grid, [nx, ny]) {
  // allocate buffers
  const yc = new Float64Array(Math.max(nx, ny)); // causal
  const ya = new Float64Array(Math.max(nx, ny)); // anticausal
  const h = new Float64Array(5);
  const d = new Float64Array(grid.length);

  // convolve rows
  for (let row = 0, r0 = 0; row < ny; ++row, r0 += nx) {
    const dx = d.subarray(r0);
    dericheConv1d(cx, grid.subarray(r0), nx, 1, yc, ya, h, dx);
  }

  // convolve columns
  for (let c0 = 0; c0 < nx; ++c0) {
    const dy = d.subarray(c0);
    dericheConv1d(cy, dy, ny, nx, yc, ya, h, dy);
  }

  return d;
}

function dericheConv1d(
  c, src, N,
  stride = 1,
  y_causal = new Float64Array(N),
  y_anticausal = new Float64Array(N),
  h = new Float64Array(5),
  d = y_causal,
  init = dericheInitZeroPad
) {
  const stride_2 = stride * 2;
  const stride_3 = stride * 3;
  const stride_4 = stride * 4;
  const stride_N = stride * N;
  let i, n;

  // initialize causal filter on the left boundary
  init(
    y_causal, src, N, stride,
    c.b_causal, 3, c.a, 4, c.sum_causal, h, c.sigma
  );

  // filter the interior samples using a 4th order filter. Implements:
  // for n = K, ..., N - 1,
  //   y^+(n) = \sum_{k=0}^{K-1} b^+_k src(n - k)
  //          - \sum_{k=1}^K a_k y^+(n - k)
  // variable i tracks the offset to the nth sample of src, it is
  // updated together with n such that i = stride * n.
  for (n = 4, i = stride_4; n < N; ++n, i += stride) {
    y_causal[n] = c.b_causal[0] * src[i]
      + c.b_causal[1] * src[i - stride]
      + c.b_causal[2] * src[i - stride_2]
      + c.b_causal[3] * src[i - stride_3]
      - c.a[1] * y_causal[n - 1]
      - c.a[2] * y_causal[n - 2]
      - c.a[3] * y_causal[n - 3]
      - c.a[4] * y_causal[n - 4];
  }

  // initialize the anticausal filter on the right boundary
  init(
    y_anticausal, src, N, -stride,
    c.b_anticausal, 4, c.a, 4, c.sum_anticausal, h, c.sigma
  );

  // similar to the causal filter above, the following implements:
  // for n = K, ..., N - 1,
  //   y^-(n) = \sum_{k=1}^K b^-_k src(N - n - 1 - k)
  //          - \sum_{k=1}^K a_k y^-(n - k)
  // variable i is updated such that i = stride * (N - n - 1).
  for (n = 4, i = stride_N - stride * 5; n < N; ++n, i -= stride) {
    y_anticausal[n] = c.b_anticausal[1] * src[i + stride]
      + c.b_anticausal[2] * src[i + stride_2]
      + c.b_anticausal[3] * src[i + stride_3]
      + c.b_anticausal[4] * src[i + stride_4]
      - c.a[1] * y_anticausal[n - 1]
      - c.a[2] * y_anticausal[n - 2]
      - c.a[3] * y_anticausal[n - 3]
      - c.a[4] * y_anticausal[n - 4];
  }

  // sum the causal and anticausal responses to obtain the final result
  if (c.negative) {
    // do not threshold if the input grid includes negatively weighted values
    for (n = 0, i = 0; n < N; ++n, i += stride) {
      d[i] = y_causal[n] + y_anticausal[N - n - 1];
    }
  } else {
    // threshold to prevent small negative values due to floating point error
    for (n = 0, i = 0; n < N; ++n, i += stride) {
      d[i] = Math.max(0, y_causal[n] + y_anticausal[N - n - 1]);
    }
  }

  return d;
}

function dericheInitZeroPad(dest, src, N, stride, b, p, a, q, sum, h) {
  const stride_N = Math.abs(stride) * N;
  const off = stride < 0 ? stride_N + stride : 0;
  let i, n, m;

  // compute the first q taps of the impulse response, h_0, ..., h_{q-1}
  for (n = 0; n < q; ++n) {
    h[n] = (n <= p) ? b[n] : 0;
    for (m = 1; m <= q && m <= n; ++m) {
      h[n] -= a[m] * h[n - m];
    }
  }

  // compute dest_m = sum_{n=1}^m h_{m-n} src_n, m = 0, ..., q-1
  // note: q == 4
  for (m = 0; m < q; ++m) {
    for (dest[m] = 0, n = 1; n <= m; ++n) {
      i = off + stride * n;
      if (i >= 0 && i < stride_N) {
        dest[m] += h[m - n] * src[i];
      }
    }
  }

  // dest_m = dest_m + h_{n+m} src_{-n}
  const cur = src[off];
  if (cur > 0) {
    for (m = 0; m < q; ++m) {
      dest[m] += h[m] * cur;
    }
  }

  return;
}

function extent(data, x, pad = 0) {
  const n = data.length;
  let lo;
  let hi;
  for (let i = 0; i < n; ++i) {
    const v = x(data[i], i, data);
    if (v != null) {
      if (lo === undefined) {
        if (v >= v) lo = hi = v;
      } else {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  }
  return [lo - pad, hi + pad];
}

function bin1d(data, x, weight, lo, hi, n) {
  const grid = new Float64Array(n);
  const delta = (n - 1) / (hi - lo);

  for (let i = 0; i < data.length; ++i) {
    const d = data[i];
    const xi = x(d, i, data);
    const wi = weight(d, i, data);

    // skip NaN and Infinite values
    if (!(Number.isFinite(xi) && Number.isFinite(wi))) {
      continue;
    }

    const p = (xi - lo) * delta;
    const u = Math.floor(p);
    const v = u + 1;

    if (0 <= u && v < n) {
      grid[u] += (v - p) * wi;
      grid[v] += (p - u) * wi;
    } else if (u === -1) {
      grid[v] += (p - u) * wi;
    } else if (v === n) {
      grid[u] += (v - p) * wi;
    }
  }

  return grid;
}
