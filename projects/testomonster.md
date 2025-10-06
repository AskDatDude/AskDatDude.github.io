<!--- metadata
id: 001
title: TestoMonster Encryption
subtitle: Javascript encryption algorithm
date: 28.11.2023
url: projects/project.html?project=testomonster
image: /assets/TestoMonster.png
imageAlt: TestoMonster Encryption logo
summary: TestoMonster is a simple encryption algorithm that we created using Javascript. TestoMonster takes this idea and adds a few extra features to make the encryption more secure and difficult to crack.
tags: ["JavaScript", "Cybersecurity", "Algorithm"]
collaborators: ["TNorba", "Sibuli"]
duration: 3 weeks
tools: ["HTML & CSS", "Javascript"]
buttons: [{"text": "TestoMonster Encryption", "url": "https://rbin.dev/cipher/"}, {"text": "GitHub Repository", "url": "https://rbin.dev/cipher/"}]
--->

### What is TestoMonster?

TestoMonster is a simple encryption algorithm that we created using Javascript. TestoMonster takes this idea and adds a few extra features to make the encryption more secure and difficult to crack.

This algorithm is designed to be easy to use and understand, while still being secure. This project was created as part of a course on web development, and we wanted to create something that would be both fun and educational.

### How Does it work?

![Code snippet](/assets/code.png)

The algorithm uses two keys (keyList and keyList2) which are shuffled arrays of predefined character sets (avain0 to avain9). The calculate function encrypts the input text by replacing each character with a corresponding character from the shuffled keys.

The deCryptCalculate function does the reverse, decrypting the text by replacing each character with the corresponding character from the original keys.

![Code snippet](/assets/code2.png)

The keys are shuffled using the shuffleKey and shuffleKey2 functions, which use the Fisher-Yates (or Knuth) shuffle algorithm. The getKeyNumber and getKey2Number functions convert the shuffled keys back into a string of numbers, which is used as the decryption key.

The encrypt and decrypt functions perform the actual encryption and decryption. They iterate over each character in the input text, find its position in the current key, and replace it with the character at the same position in the other key. If the character is not found in the key, it is left unchanged.

### Conclusion

TestoMonster is a simple encryption algorithm that we created using Javascript. This project was extreamly educational, and we learned a lot about encryption and even had to optimize the code to make it work. As this was our first encryption project, we are very proud of the result and hope to continue working on similar projects in the future.
