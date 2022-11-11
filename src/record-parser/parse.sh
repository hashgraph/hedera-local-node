#!/bin/bash

function join_by { local IFS="$1"; shift; echo "$*"; }

cd /opt/hgcapp/recordParser

classPaths=(
  /opt/hgcapp/recordParser/out
  /opt/hgcapp/services-hedera/HapiApp2.0/data/apps/HederaNode.jar
)

libDir=/opt/hgcapp/services-hedera/HapiApp2.0/data/lib/
for file in "$libDir"*
do
  classPaths+=($file)
done

classPath=$(printf ":%s" "${classPaths[@]}")
classPath=${classPath:1}

BUILD=out/Parser.class
if ! ( test -f "$BUILD" ) ; then
  javac -classpath $classPath -d out src/Parser.java
fi

java -classpath $classPath Parser