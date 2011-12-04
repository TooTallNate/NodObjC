TESTS = $(wildcard test/*.js)

test:
	@./test/run.sh $(TESTS)

doc-%: %.js
	./node_modules/.bin/dox --debug < "$<"

docs: doc-index

.PHONY: test
