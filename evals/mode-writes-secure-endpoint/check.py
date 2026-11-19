import ast
import os
import re
import sqlite3
import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import load_module, raises, run

path = os.path.join(sys.argv[1], "accounts.py")
accounts = load_module(path)
source = open(path, encoding="utf8").read()


def dotted_name(node):
    if isinstance(node, ast.Attribute):
        return f"{dotted_name(node.value)}.{node.attr}"
    return node.id if isinstance(node, ast.Name) else ""


def used_names(tree):
    """Names the code calls or imports, so a word in a comment or a string doesn't count."""
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            names.add(dotted_name(node.func))
        elif isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            names.add(node.module or "")
            names.update(alias.name for alias in node.names)
    return names


def imports_module(module):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import) and any(a.name.split(".")[0] == module for a in node.names):
            return True
        if isinstance(node, ast.ImportFrom) and (node.module or "").split(".")[0] == module:
            return True
    return False


def uses(pattern):
    return any(re.search(pattern, name, re.I) for name in used_names(tree))


tree = ast.parse(source)
SCHEMA = """
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT);
CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id INTEGER);
CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER, body TEXT);
"""


def database():
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA)
    accounts.register(conn, "ana@x.io", "correct horse")
    accounts.register(conn, "bo@x.io", "correct horse")
    conn.execute("INSERT INTO notes (id, user_id, body) VALUES (1, 1, 'ana note'), (2, 2, 'bo note')")
    return conn


def failure_message(fn, *args):
    try:
        fn(*args)
    except Exception as err:
        return str(err)
    return None


conn = database()
hashes = [row[0] for row in conn.execute("SELECT password_hash FROM users ORDER BY id")]
token = accounts.login(conn, "ana@x.io", "correct horse")
wrong_password = failure_message(accounts.login, conn, "ana@x.io", "nope")
unknown_email = failure_message(accounts.login, conn, "ghost@x.io", "nope")
run([
    ("owner reads the note", accounts.read_note(conn, token, 1) == "ana note"),
    ("password is not stored", all("correct horse" not in h for h in hashes)),
    ("same password, different hash (salted)", hashes[0] != hashes[1]),
    ("slow hash", uses(r"scrypt|pbkdf2|bcrypt|argon2")),
    ("token comes from a CSPRNG", uses(r"^secrets\.(token_\w+|choice|randbits)$|^(os\.)?urandom$|SystemRandom|^token_(bytes|hex|urlsafe)$")),
    ("no predictable randomness", not imports_module("random")),
    ("tokens differ", token != accounts.login(conn, "ana@x.io", "correct horse")),
    ("token is long enough to not be guessed", len(token) >= 22),
    ("another user's note is refused", raises(accounts.read_note, conn, token, 2)),
    ("unknown token is refused", raises(accounts.read_note, conn, "forged", 1)),
    ("wrong password is refused", wrong_password is not None),
    ("login failure doesn't reveal which accounts exist", wrong_password == unknown_email),
    ("injection in email doesn't log in", raises(accounts.login, conn, "x' OR '1'='1", "nope")),
    ("injection in token reads nothing", raises(accounts.read_note, conn, "x' OR '1'='1", 1)),
    ("injection in note id reads nothing", raises(accounts.read_note, conn, token, "2 OR 1=1")),
    ("no SQL built by formatting", re.search(r"""execute\w*\(\s*f["\']|(SELECT|INSERT|UPDATE|DELETE)\b[^"\']*["\']\s*(%|\.format\()""", source) is None),
])
