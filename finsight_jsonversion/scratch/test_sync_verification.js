const compareClocks = (clockA, clockB) => {
  const keys = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);
  let greater = false;
  let lesser = false;

  for (const k of keys) {
    const valA = clockA[k] || 0;
    const valB = clockB[k] || 0;
    if (valA > valB) greater = true;
    if (valA < valB) lesser = true;
  }

  if (greater && !lesser) return 'newer'; // clockA is newer
  if (!greater && lesser) return 'older'; // clockB is newer (local is newer)
  if (greater && lesser) return 'concurrent'; // conflict
  return 'equal';
};

const assert = (actual, expected, message) => {
  if (actual !== expected) {
    console.error(`FAILED: ${message}. Expected ${expected}, got ${actual}`);
    process.exit(1);
  } else {
    console.log(`PASSED: ${message}`);
  }
};

// Test equal
assert(compareClocks({ devA: 1 }, { devA: 1 }), 'equal', 'Identical clocks');

// Test newer
assert(compareClocks({ devA: 2 }, { devA: 1 }), 'newer', 'Incoming is newer (single dev)');
assert(compareClocks({ devA: 1, devB: 2 }, { devA: 1, devB: 1 }), 'newer', 'Incoming has higher counter on devB');
assert(compareClocks({ devA: 1, devB: 1 }, { devA: 1 }), 'newer', 'Incoming has extra device devB');

// Test older
assert(compareClocks({ devA: 1 }, { devA: 2 }), 'older', 'Local is newer (single dev)');
assert(compareClocks({ devA: 1, devB: 1 }, { devA: 1, devB: 2 }), 'older', 'Local has higher counter on devB');

// Test concurrent conflict
assert(compareClocks({ devA: 2, devB: 1 }, { devA: 1, devB: 2 }), 'concurrent', 'Concurrent modification conflict');

console.log('SUCCESS: Vector Clock reconciliation comparisons work perfectly!');
