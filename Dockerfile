FROM node:14

RUN set -x \
  && git clone https://github.com/DataBiosphere/terra-ui.git \
  && cd terra-ui \
  && git checkout ss_hello_world_ui \
  && npm install \
  && npm run build

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:stable-alpine
COPY --from=0 /terra-ui/build /usr/share/nginx/html
