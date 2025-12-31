# 🐾 Cozy Cat for SillyTavern

**Cozy Cat** is a SillyTavern extension that adds an immersive, interactive pet cat companion to your roleplay chats. It tracks your kitten's age, status (hunger, happiness, hygiene, energy), and displays a beautiful overlay UI inspired by cozy mobile apps.

> **Note:** This extension is designed to work with specific a character card and Lorebooks that output data in a format the extension can read, which is "Your Pet Cat."

## ✨ Features

* **Interactive Overlay:** A "phone-like" interface accessible via a draggable **Paw Button** 🐾.
  

  <img src="UI Preview/01-home.jpg"  width= "300" > 


* **Status Tracking:** Automatically tracks dynamic stats based on roleplay context:
    * 🥩 **Hunger**
    * 🧸 **Happiness**
    * 🧼 **Hygiene**
    * ⚡ **Energy**
    * ❤ **Health Status** (Healthy, Weak, Sick, Injured, Critical)

![image](https://github.com/Mors1212/cozy-cat-for-ST/blob/efc64a6703dd856c8150ed36837ce752607ef500/UI%20Preview/04-status.jpg)

* **Growth System:** Tracks the cat's age based on Calendar UI in the chat.
* **Pet Card:** A flippable card showing your cat's personality traits.

![image](https://github.com/Mors1212/cozy-cat-for-ST/blob/efc64a6703dd856c8150ed36837ce752607ef500/UI%20Preview/02-card-front.jpg) ![image](https://github.com/Mors1212/cozy-cat-for-ST/blob/efc64a6703dd856c8150ed36837ce752607ef500/UI%20Preview/03-card-back.jpg)

* **Music Player:** A built-in vinyl player that plays a cozy background loop.

![image](https://github.com/Mors1212/cozy-cat-for-ST/blob/efc64a6703dd856c8150ed36837ce752607ef500/UI%20Preview/05-music.jpg)

* **Per-Chat Persistence:** Cat data is saved specifically for each chat session, which can be reset by user.

![image](https://github.com/Mors1212/cozy-cat-for-ST/blob/efc64a6703dd856c8150ed36837ce752607ef500/UI%20Preview/reset.jpg)

## 📦 Installation

1.  Open SillyTavern.
2.  Go to **Extensions** > **Install Extension**.
3.  Paste the URL of this repository (or unzip the files into `SillyTavern/public/scripts/extensions/cozy-cat-for-ST`).
4.  Reload SillyTavern.
5.  Ensure the extension is enabled in the Extensions menu.

## 📖 How it Works 

This extension listens for specific **hidden HTML comments** in the AI's output to update the UI.


## 🔥 Special Thanks: POPKO
Thanks for helping me start things off; otherwise, I'd still be procrastinating, not knowing where to begin.

