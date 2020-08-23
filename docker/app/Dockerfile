FROM node:12

# Chrome/Puppeteer support
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install dumb-init
# https://github.com/Yelp/dumb-init
# This fixes issues with zombie Chrome processes:
# https://github.com/GoogleChrome/puppeteer/issues/615
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb &&\
    dpkg -i dumb-init_*.deb

WORKDIR /app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["yarn", "cron"]
