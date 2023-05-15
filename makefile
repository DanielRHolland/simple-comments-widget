build: ./main.scm
	mkdir -p ./build
	chicken-csc -static ./main.scm \
		-L -lsqlite3
	mv ./main ./build/main
run: build
	./build/main

clean:
	rm -r build/


