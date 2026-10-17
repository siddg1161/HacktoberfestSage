FROM langchain/langgraph-api:3.11

RUN printf '\nprecedence ::ffff:0:0/96  100\n' >> /etc/gai.conf

# -- 1. Install dependencies from requirements.txt --
ADD requirements.txt /deps/outer-agents/src/requirements.txt

RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir -c /api/constraints.txt -r /deps/outer-agents/src/requirements.txt

# -- 2. Copy project source code (excluding .venv via .dockerignore) --
ADD . /deps/outer-agents/src

RUN set -ex && \
    for line in '[project]' \
                'name = "agents"' \
                'version = "0.1"' \
                '[tool.setuptools.package-data]' \
                '"*" = ["**/*"]' \
                '[build-system]' \
                'requires = ["setuptools>=61"]' \
                'build-backend = "setuptools.build_meta"'; do \
        echo "$line" >> /deps/outer-agents/pyproject.toml; \
    done

# -- 3. Install local project package --
RUN for dep in /deps/*; do \
        echo "Installing $dep"; \
        if [ -d "$dep" ]; then \
            (cd "$dep" && PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir -c /api/constraints.txt -e .); \
        fi; \
    done

# -- 4. Point to QuoteFlow Graph --
ENV LANGSERVE_GRAPHS='{"quoteflow": "/deps/outer-agents/src/agent/graph.py:graph"}'

# -- 5. Ensure LangGraph API runtime integrity --
RUN mkdir -p /api/langgraph_api /api/langgraph_runtime /api/langgraph_license && touch /api/langgraph_api/__init__.py /api/langgraph_runtime/__init__.py /api/langgraph_license/__init__.py
RUN PYTHONDONTWRITEBYTECODE=1 uv pip install --system --no-cache-dir --no-deps -e /api

# -- 6. Cleanup build tooling to keep image slim --
RUN pip uninstall -y pip setuptools wheel
RUN rm -rf /usr/local/lib/python*/site-packages/pip* /usr/local/lib/python*/site-packages/setuptools* /usr/local/lib/python*/site-packages/wheel* && find /usr/local/bin -name "pip*" -delete || true
RUN rm -rf /usr/lib/python*/site-packages/pip* /usr/lib/python*/site-packages/setuptools* /usr/lib/python*/site-packages/wheel* && find /usr/bin -name "pip*" -delete || true
RUN uv pip uninstall --system pip setuptools wheel && rm /usr/bin/uv /usr/bin/uvx

WORKDIR /deps/outer-agents/src

EXPOSE 8000