FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock*  ./

# Install dependencies
RUN yarn install --frozen-lockfile;

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN yarn build

EXPOSE 4173

CMD ["yarn", "preview", "--host", "0.0.0.0"]

