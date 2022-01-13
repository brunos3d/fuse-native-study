# fuse-native-study

This is a study project of the [fuse-native](https://github.com/fuse-friends/fuse-native) package, created in pair-programming with my friend [mukaschultze](https://github.com/mukaschultze/).

You should be careful when executing the code, as you will likely take a [rate-limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting) from the GitHub API.

## Explanation

This program will create a mount point in the [\_explorer](https://github.com/BrunoS3D/fuse-native-study/tree/main/_explorer) folder using [FUSE](https://en.wikipedia.org/wiki/Filesystem_in_Userspace) and dynamically insert virtualized directories and files into memory, which will disappear after closing the program.

The folders will be GitHub accounts username, this information is consumed in real time by [axios](https://github.com/axios/axios).

You will also notice that each folder will have folders containing followers and followed accounts (recursion).

You will notice that each user's folder contains a file called avatar.png, this file is dynamically downloaded and cached in the [\_temp](https://github.com/BrunoS3D/fuse-native-study/tree/main/_temp) folder

Due to the amount of information consumed with each new folder opened, you will notice that the program will stop working. This is because the GitHub API has a [rate-limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting) for unauthenticated requests, but don't worry, this restriction will soon end.
