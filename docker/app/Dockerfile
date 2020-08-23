FROM node:12

# Headless Chrome config
# From: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

# Install latest chrome (dev) package.
# Note: this also installs the necessary libs so we don't need the previous RUN command.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - &&\
    sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' &&\
    apt-get update &&\
    apt-get install -y google-chrome-unstable libgconf-2-4

# Install dumb-init
# https://github.com/Yelp/dumb-init
# This fixes issues with zombie Chrome processes:
# https://github.com/GoogleChrome/puppeteer/issues/615
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64.deb &&\
    dpkg -i dumb-init_*.deb

WORKDIR /app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["yarn", "cron"]
