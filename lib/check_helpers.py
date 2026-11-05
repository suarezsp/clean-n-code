"""Shared helpers for the hidden checks in evals/<case>/check.py (run by `npm run ab -- --check`)."""
import importlib.util
import inspect
import sys


def load_module(path, name="solution"):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def only_function(module):
    """The module's single public top-level function; the prompt left its name to the agent."""
    found = [f for n, f in vars(module).items()
             if inspect.isfunction(f) and f.__module__ == module.__name__ and not n.startswith("_")]
    if len(found) != 1:
        found = [f for f in found if not any(f.__name__ in inspect.getsource(g) for g in found if g is not f)]
    assert len(found) == 1, f"expected one entry function, found {[f.__name__ for f in found]}"
    return found[0]


def raises(fn, *args):
    try:
        fn(*args)
    except Exception:
        return True
    return False


def run(checks):
    failed = [name for name, ok in checks if not ok]
    for name in failed:
        print(f"FAIL {name}")
    sys.exit(1 if failed else 0)
