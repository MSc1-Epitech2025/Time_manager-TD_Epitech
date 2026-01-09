FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

CMD envsubst '$FRONTEND_CONTAINER_NAME $FRONTEND_PORT $BACKEND_CONTAINER_NAME $BACKEND_PORT $FRONTEND_URL' \
    < /etc/nginx/templates/nginx.conf.template \
    > /etc/nginx/nginx.conf \
    && nginx -g 'daemon off;'
