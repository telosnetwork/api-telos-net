DOCKER_IMAGE := registry.gitlab.com/telosfoundation/api-telos-net/fastify-api
TAG_VERSION := 0.0.1

# Build image and push up to registry
update-image: build push-registry

build:
	@docker build -t $(DOCKER_IMAGE):$(TAG_VERSION) .

push-registry:
	@docker push $(DOCKER_IMAGE):$(TAG_VERSION)

shell:
	@docker run -it --rm $(DOCKER_IMAGE):$(TAG_VERSION) sh

test:
	@docker run --rm -p 3000:3000 $(DOCKER_IMAGE):$(TAG_VERSION)