FROM postgres:16

# Install build dependencies and pgvector
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    git \
    postgresql-server-dev-16 && \
    cd /tmp && \
    git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    cd / && \
    rm -rf /tmp/pgvector && \
    apt-get remove -y build-essential git postgresql-server-dev-16 && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5432