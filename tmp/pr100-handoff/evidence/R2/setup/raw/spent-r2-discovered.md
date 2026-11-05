Discovered: SPEC 2.3 store helpers are missing. Out of scope because bin/lib.sh is its own component and must land before append. Blocks this ticket: yes.
Observed: bin/lib.sh and tests/test_lib.sh do not exist at fixture main. SPEC 2.3 requires both.
Reproduce: rg --files bin tests.
Because: append acceptance criteria require read_store and write_store.
Verified: yes. Unchecked: nothing.
