FROM node:9-alpine

# Create app directory
WORKDIR app

# Copy app src code to the image
COPY src/ .

RUN npm install

EXPOSE 8080
CMD [ "npm", "start" ]