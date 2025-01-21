# FAQ

**Q: Can I run the local node on a Windows machine?**\
A: Yes but you will need WSL v2 to be installed.


**Q: Can I run the local node on MacOS with an Intel CPU?**\
A: Yes but make sure that the minimum system requirements are met.

**Q: Can I stop the local node, save its state then start it again after a while?**\
A: No, currently the local node doesn't support network freezing. Once you stop it, the next start will be with a genesis state and all of your accounts/contracts/tokens will be wiped.


**Q: What should I do if this error appears on Windows?**
```
Postgres error:
/usr/local/bin/docker-entrypoint.sh: /docker-entrypoint-initdb.d/init.sh: /bin/bash: bad interpreter: No such file or directory
Solution:
```
A: You have to set a global git config then clone the local node repository again.
```
git config --global core.autocrlf input
Delete your local repository.
Clone it again.
```