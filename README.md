# Gitly

Implementing subset of [git](https://git-scm.com/) for educational purpose. Based on http://gitlet.maryrosecook.com/docs/gitlet.html

Supported commands:

- [x] `init` - initialize empty repository
- [x] `add` - add files to the index
- [x] `rm` - remove files from working tree and index
- [x] `commit` - record changes to the repository
- [x] `status` - show the working tree status
- [x] `diff`- show changes between commits
- [x] `log` - show commit logs

## Contributing

### OS requirements

- Install [bun](https://bun.sh/) runtime

### Project dependencies

```bash
bun install
```

### Unit tests

```bash
bun run test
```

### Check for lint issues

```bash
bun run lint
```

### Fix lint issues

```bash
bun run lint:fix
```

### Build executable file

```bash
bun run build
```
