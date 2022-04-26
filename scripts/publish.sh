#!/bin/bash
{
    gh --version
} || {
    echo
    echo
    echo "Github-CLI is not installed. Please refer to: https://cli.github.com/"
    exit 1
}
cd ../
{
	user=$(npm whoami 2> /dev/null) && echo "You are logged in NPM as $user"
} || {
	npm login
}
gh auth login

echo
echo
echo "How would you like to bump the package version (the format is: major.minor.patch):"

options=(
	"Bump patch version"
	"Bump minor version"
	"Bump major version"
	"None. The version is already bumped"
	)

versionType=none

echo
echo

select opt in "${options[@]}"
do
    case $opt in
        "Bump patch version")
            versionType=patch
            break;
            ;;
        "Bump minor version")
            versionType=minor
            break;
            ;;
        "Bump major version")
            versionType=major
            break;
            ;;
        "None. The version is already bumped")
			echo "Skipping version bumping"
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done

if [ "$versionType" != none ]
then
    echo
    echo
    echo "Checkout to default branch..."
    defaultBranch=`basename $(git symbolic-ref --short refs/remotes/origin/HEAD)`
    git checkout $defaultBranch
    git pull

    echo "Bumping version - $versionType"
    npm version $versionType -s
    version=`node --eval="process.stdout.write(require('./package.json').version)"`

    echo
    echo
    echo "Checkout new branch: v$version"
    git branch v$version
    git checkout v$version
    git push --set-upstream origin HEAD:v$version
    git push --tags
    gh pr create --fill
    echo
    echo
    echo "Please merge the created PR before continuing the script execution"
    while true; do
        read -p "Is the PR merged? (y/n)?" choice
        case "$choice" in
          y|Y ) echo "PR is merged"; break;;
          n|N ) echo "canceled" && exit 0;;
          * ) echo;;
        esac
    done
    git checkout $defaultBranch
    gh release create v$version
else
    gh release create
fi

echo
echo
echo "Publishing to NPM..."
npm publish