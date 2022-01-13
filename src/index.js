const Fuse = require('fuse-native');
const Fs = require('fs');
const Path = require('path');

const axios = require('./sevices/axios');

const local = true;
const mnt = `./_explorer`;
const tempFolder = `_temp`;
const resources = [`followers`, `following`, `repos`];
const users = [`gabrieldejesus`, `caiodomingues`, `mukaschultze`, `brunos3d`];

const ops = {
  readdir: async function (path, cb) {
    try {
      if (path === '/') return cb(null, users);

      const frags = path.split('/');

      if (frags.length > 5) return cb(Fuse.ENOENT);

      const arg = frags[frags.length - 1];

      switch (arg) {
        // followers
        case resources[0]: {
          const user = frags[frags.length - 2];

          if (local)
            return cb(
              null,
              users.filter((u) => u !== user)
            );

          const res = await axios.get(`/users/${user}/followers`);
          return cb(
            null,
            res.data.map((f) => f.login)
          );
        }
        // following
        case resources[1]: {
          const user = frags[frags.length - 2];

          if (local)
            return cb(
              null,
              users.filter((u) => u !== user)
            );

          const res = await axios.get(`/users/${user}/following`);
          return cb(
            null,
            res.data.map((f) => f.login)
          );
        }
        // repos
        case resources[2]:
          break;
        // user
        default: {
          if (local) {
            if (!users.includes(arg)) return cb(Fuse.ENOENT);
            return cb(null, [...users.filter((u) => u !== arg), `avatar.png`]);
          }

          const res = await axios.get(`/users/${arg}`);

          if (res.status == 404) return cb(Fuse.ENOENT);

          return cb(null, [...resources, `avatar.png`]);
        }
      }

      return cb(Fuse.ENOENT);
    } catch (error) {
      console.error(error);
      return cb(Fuse.EIO);
    }
  },
  getattr: function (path, cb) {
    try {
      if (path.endsWith(`.png`)) {
        const frags = path.split('/');
        const user = frags[frags.length - 2];
        const tempFilePath = Path.resolve(tempFolder, `${user}.png`);
        Fs.stat(tempFilePath, (err, stats) => {
          // if (err) return cb(err?.errno ?? Fuse.EIO);
          cb(
            null,
            stats ?? {
              mtime: new Date(),
              atime: new Date(),
              ctime: new Date(),
              nlink: 1,
              size: 200000,
              mode: 33188,
              uid: process.getuid ? process.getuid() : 0,
              gid: process.getgid ? process.getgid() : 0,
            }
          );
        });
      } else {
        cb(null, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          nlink: 1,
          size: 100,
          mode: 16877,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
      }
    } catch (error) {
      console.error(error);
      return cb(Fuse.EIO);
    }
  },
  open: async function (path, flags, cb) {
    try {
      const frags = path.split('/');
      const arg = frags[frags.length - 1];

      if (resources.includes(arg)) return cb(Fuse.EISDIR);
      if (arg !== `avatar.png`) return cb(Fuse.ENOENT);

      const user = frags[frags.length - 2];

      const tempFilePath = Path.resolve(tempFolder, `${user}.png`);

      if (!Fs.existsSync(tempFilePath)) {
        console.log(`=================================`);
        console.log(`========== downloading ==========`);
        console.log(`https://github.com/${user}.png`);
        console.log(`=================================`);
        const writer = Fs.createWriteStream(tempFilePath);

        const response = await axios({
          url: `https://github.com/${user}.png`,
          method: 'GET',
          responseType: 'stream',
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      }

      Fs.open(tempFilePath, flags, function (err, fd) {
        if (err) return cb(err?.errno ?? Fuse.EIO);
        return cb(0, fd);
      });
    } catch (error) {
      console.error(error);
      return cb(Fuse.EIO);
    }
    // return cb(0, 42);
  },
  release: function (path, fd, cb) {
    try {
      Fs.close(fd, function (err) {
        if (err) return cb(err?.errno ?? Fuse.EIO);
        return cb(0);
      });
    } catch (error) {
      console.error(error);
      return cb(Fuse.EIO);
    }
  },
  read: function (path, fd, buf, len, pos, cb) {
    try {
      Fs.read(fd, buf, 0, len, pos, function (err, bytesRead) {
        if (err) return cb(err?.errno ?? Fuse.EIO);
        return cb(bytesRead);
      });
    } catch (error) {
      console.error(error);
      return cb(Fuse.EIO);
    }
  },
};

const fuse = new Fuse(mnt, ops, { debug: true, mkdir: true, force: true });

fuse.mount(function (err) {
  console.error(err);
});

process.once('SIGINT', function () {
  fuse.unmount((err) => {
    if (err) {
      console.log('filesystem at ' + fuse.mnt + ' not unmounted', err);
    } else {
      console.log('filesystem at ' + fuse.mnt + ' unmounted');
    }
  });
});
