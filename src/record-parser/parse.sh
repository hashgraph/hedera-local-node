#!/bin/bash

function join_by { local IFS="$1"; shift; echo "$*"; }

cd /opt/hgcapp/recordParser

classPaths=(
  /opt/hgcapp/recordParser/out/production/record-parser
  /opt/hgcapp/services-hedera/HapiApp2.0/data/apps/HederaNode.jar
)

libDir=/opt/hgcapp/services-hedera/HapiApp2.0/data/lib/
for file in "$libDir"*
do
  classPaths+=($file)
done

classPath=$(printf ":%s" "${classPaths[@]}")
classPath=${classPath:1}

java -classpath $classPath Main