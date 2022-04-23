# Don't "Accept" image/webP - extension for Firefox

Firefox usually sends websites an indicator that it can handle webP-format images, and this may encourage sites to send images in webP formats. (Similar situation for AVIF.) This extension strips out that indicator from requests so sites are more likely to send JPEG and PNG format images.

Available at: https://addons.mozilla.org/firefox/addon/dont-accept-webp/

Version 0.8 adds an exemption for Patreon and a new menu item to create site exemptions.

![version 0.8 popup menu](https://github.com/jscher2000/dont-accept-webp/blob/master/menu-button-0.8.png)
