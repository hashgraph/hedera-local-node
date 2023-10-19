########################################################################################################################
#
# Define Global Build Arguments
#
########################################################################################################################
#ARG UBUNTU_TAG="focal-20220426"
#ARG UBUNTU_TAG="focal-20220531"
#ARG UBUNTU_TAG="focal-20220801"
#ARG UBUNTU_TAG="focal-20220922"
#ARG UBUNTU_TAG="focal-20221019"
#ARG UBUNTU_TAG="focal-20221130"
ARG UBUNTU_TAG="focal-20230126"

########################################################################################################################
#
# Setup Builder Image
#
########################################################################################################################
FROM ubuntu:${UBUNTU_TAG} AS openjdk-builder

# Define Standard Environment Variables
ENV LC_ALL=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive

# Install basic OS utilities for building
RUN apt-get update && \
  apt-get install --yes --no-install-recommends tar gzip gnupg2 curl ca-certificates

##########################
####    Java Setup    ####
##########################

RUN set -eux; \
        ARCH="$(dpkg --print-architecture)"; \
        case "${ARCH}" in \
          aarch64|arm64) \
            ESUM='9e0e88bbd9fa662567d0c1e22d469268c68ac078e9e5fe5a7244f56fec71f55f'; \
            BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.6%2B10/OpenJDK17U-jdk_aarch64_linux_hotspot_17.0.6_10.tar.gz'; \
          ;; \
          armhf|arm) \
            ESUM='fe4d0c6d5bb8cf7f59f7ff82c0c1fd988bbe5cccf3bc7377dc8ae50740b46c82'; \
            BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.6%2B10/OpenJDK17U-jdk_arm_linux_hotspot_17.0.6_10.tar.gz'; \
          ;; \
          ppc64el|powerpc:common64) \
            ESUM='cb772c3fdf3f9fed56f23a37472acf2b80de20a7113fe09933891c6ef0ecde95'; \
            BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.6%2B10/OpenJDK17U-jdk_ppc64le_linux_hotspot_17.0.6_10.tar.gz'; \
          ;; \
          s390x|s390:64-bit) \
            ESUM='32e53321dd3e724e111e5445fbdcbcefde893e59055cc1f102d20fa3bb62ccc3'; \
            BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.6%2B10/OpenJDK17U-jdk_s390x_linux_hotspot_17.0.6_10.tar.gz'; \
          ;; \
          amd64|i386:x86-64) \
            ESUM='a0b1b9dd809d51a438f5fa08918f9aca7b2135721097f0858cf29f77a35d4289'; \
            BINARY_URL='https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.6%2B10/OpenJDK17U-jdk_x64_linux_hotspot_17.0.6_10.tar.gz'; \
          ;; \
          *) \
           echo "Unsupported arch: ${ARCH}"; \
           exit 1; \
           ;; \
        esac; \
    curl -LfsSo /tmp/openjdk.tar.gz ${BINARY_URL}; \
    echo "${ESUM} */tmp/openjdk.tar.gz" | sha256sum -c -; \
    mkdir -p /usr/local/java; \
    cd /usr/local/java/; \
    tar -xf /tmp/openjdk.tar.gz; \
    rm -rf /tmp/openjdk.tar.gz;


########################################################################################################################
#
# Build Final Image
#
########################################################################################################################
FROM ubuntu:${UBUNTU_TAG} AS openjdk-base

# Define Standard Environment Variables
ENV LC_ALL=C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive
ENV JAVA_VERSION="jdk-17.0.6+10"
ENV JAVA_HOME="/usr/local/java/${JAVA_VERSION}"

# Fetch Validated Java Binaries
COPY --from=openjdk-builder /usr/local/java/ /usr/local/java/

# Install Basic OS Requirements
RUN apt-get update && \
	apt-get install --yes --no-install-recommends tar gzip openssl zlib1g libsodium23 sudo netcat && \
	apt-get install --yes --no-install-recommends libnetty-tcnative-jni && \
	apt-get autoremove --yes && \
	apt-get autoclean --yes && \
	apt-get clean all --yes && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/

# Install Java Alternatives
RUN update-alternatives --install "/usr/bin/java" "java" "${JAVA_HOME}/bin/java" 1500 && \
    update-alternatives --install "/usr/bin/javac" "javac" "${JAVA_HOME}/bin/javac" 1500 && \
    update-alternatives --install "/usr/bin/javadoc" "javadoc" "${JAVA_HOME}/bin/javadoc" 1500 && \
    update-alternatives --install "/usr/bin/jshell" "jshell" "${JAVA_HOME}/bin/jshell" 1500 && \
    update-alternatives --install "/usr/bin/jstack" "jstack" "${JAVA_HOME}/bin/jstack" 1500 && \
    update-alternatives --install "/usr/bin/jps" "jps" "${JAVA_HOME}/bin/jps" 1500 && \
    update-alternatives --install "/usr/bin/jmap" "jmap" "${JAVA_HOME}/bin/jmap" 1500

# Create Application Folders
RUN mkdir -p "/opt/hgcapp" && \
    mkdir -p "/opt/hgcapp/accountBalances" && \
    mkdir -p "/opt/hgcapp/eventsStreams" && \
    mkdir -p "/opt/hgcapp/recordStreams" && \
    mkdir -p "/opt/hgcapp/services-hedera" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/apps" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/backup" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/config" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/diskFs" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/keys" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/lib" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/onboard" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/stats" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/saved" && \
    mkdir -p "/opt/hgcapp/services-hedera/HapiApp2.0/data/upgrade"

# Configure the standard user account
RUN groupadd --gid 2000 hedera && \
    useradd --no-user-group --create-home --uid 2000 --gid 2000 --shell /bin/bash hedera && \
    chown -R hedera:hedera /opt/hgcapp

# Configure SUDO support
RUN echo >> /etc/sudoers && \
    echo "%hedera ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers


# Define Volume Bindpoints
VOLUME "/opt/hgcapp/accountBalances"
VOLUME "/opt/hgcapp/eventsStreams"
VOLUME "/opt/hgcapp/recordStreams"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/config"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/diskFs"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/keys"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/onboard"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/stats"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/saved"
VOLUME "/opt/hgcapp/services-hedera/HapiApp2.0/data/upgrade"

# Set Final Working Directory and Command/Entrypoint
WORKDIR "/opt/hgcapp"
