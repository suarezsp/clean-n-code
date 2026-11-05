"""Builds the arm's LoadConfig into a throwaway module and runs a hidden Go test against it."""
import os
import re
import subprocess
import sys
import tempfile

STRUCT = 'type Config struct {\n\tPort    int    `json:"port"`\n\tDataDir string `json:"data_dir"`\n}\n'
STDLIB = ["encoding/json", "errors", "fmt", "io", "os", "strings"]
TEST = '''package cfg

import (
	"os"
	"path/filepath"
	"testing"
)

func write(t *testing.T, body string) string {
	p := filepath.Join(t.TempDir(), "c.json")
	if err := os.WriteFile(p, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
	return p
}

func TestLoadConfig(t *testing.T) {
	c, err := LoadConfig(write(t, `{"port": 8080, "data_dir": "/d"}`))
	if err != nil || c.Port != 8080 || c.DataDir != "/d" {
		t.Errorf("valid config: %v %v", c, err)
	}
	for _, port := range []string{"1", "65535"} {
		if _, err := LoadConfig(write(t, `{"port": `+port+`}`)); err != nil {
			t.Errorf("port %s rejected: %v", port, err)
		}
	}
	for _, port := range []string{"0", "65536", "-1"} {
		if _, err := LoadConfig(write(t, `{"port": `+port+`}`)); err == nil {
			t.Errorf("port %s accepted", port)
		}
	}
	if _, err := LoadConfig(write(t, `{not json`)); err == nil {
		t.Error("bad json accepted")
	}
	if _, err := LoadConfig(filepath.Join(t.TempDir(), "missing.json")); err == nil {
		t.Error("missing file accepted")
	}
}
'''


def as_package(code):
    """The prompt asks for the function only, so the package line, imports or the given struct may be missing."""
    code = re.sub(r"^package \w+\s*$", "", code, flags=re.M)
    if "type Config struct" not in code:
        code += "\n" + STRUCT
    if not re.search(r"^import\b", code, flags=re.M):
        used = [p for p in STDLIB if re.search(r"\b" + p.split("/")[-1] + r"\.", code)]
        code = "import (\n" + "".join(f'\t"{p}"\n' for p in used) + ")\n" + code
    return "package cfg\n\n" + code


with tempfile.TemporaryDirectory() as tmp:
    with open(sys.argv[1]) as f:
        source = as_package(f.read())
    for name, body in [("cfg.go", source), ("cfg_test.go", TEST), ("go.mod", "module cfg\n\ngo 1.21\n")]:
        with open(os.path.join(tmp, name), "w") as f:
            f.write(body)
    result = subprocess.run(["go", "test", "./..."], cwd=tmp, capture_output=True, text=True,
                            env={**os.environ, "GOFLAGS": "-mod=mod", "GOTOOLCHAIN": "local"})
    print(result.stdout[-800:], result.stderr[-800:])
    sys.exit(result.returncode)
