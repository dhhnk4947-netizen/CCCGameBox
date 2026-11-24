/****************************************************************************
 Copyright (c) 2013 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2022 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
****************************************************************************/

#import "ViewController.h"
#import "AppDelegate.h"
#import "platform/ios/AppDelegateBridge.h"
//#include "cocos/platform/Device.h"

namespace {
//    cc::Device::Orientation _lastOrientation;
}

@interface ViewController ()
@property(nonatomic, assign) UIInterfaceOrientationMask screenOrientationMask;
@property(nonatomic, assign) UIInterfaceOrientation requestedOrientation;
@end

@implementation ViewController

- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
    return self.screenOrientationMask ?: [super supportedInterfaceOrientations];
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
    return self.requestedOrientation != UIInterfaceOrientationUnknown
        ? self.requestedOrientation : [super preferredInterfaceOrientationForPresentation];
}

- (void)setScreenOrientation:(UIInterfaceOrientation)orientation {
    self.requestedOrientation = orientation;
    self.screenOrientationMask = (UIInterfaceOrientationMask)(1 << orientation);

    if (@available(iOS 16.0, *)) {
        [self setNeedsUpdateOfSupportedInterfaceOrientations];
        UIWindowScene *scene = self.view.window.windowScene;
        if (scene != nil) {
            UIWindowSceneGeometryPreferencesIOS *preferences =
                [[UIWindowSceneGeometryPreferencesIOS alloc] initWithInterfaceOrientations:self.screenOrientationMask];
            [scene requestGeometryUpdateWithPreferences:preferences errorHandler:^(NSError *error) {
                NSLog(@"[NativeBridge] Screen orientation request failed: %@", error);
            }];
            [preferences release];
        }
        return;
    }

    // Compatibility for iOS versions before the window-scene geometry API.
    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];
}


- (BOOL) shouldAutorotate {
    return YES;
}

//fix not hide status on ios7
- (BOOL)prefersStatusBarHidden {
    return YES;
}

// Controls the application's screen edge gesture delay to prevent accidental touches
- (UIRectEdge)preferredScreenEdgesDeferringSystemGestures
{
    return UIRectEdgeAll;
}

// Controls the application's preferred home indicator auto-showing otherwise preferredScreenEdgesDeferringSystemGestures is invalidation
- (BOOL)prefersHomeIndicatorAutoHidden {
    return NO;
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator {
   [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
   AppDelegate* delegate = [[UIApplication sharedApplication] delegate];
   [delegate.appDelegateBridge viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
   float pixelRatio = [delegate.appDelegateBridge getPixelRatio];

   //CAMetalLayer is available on ios8.0, ios-simulator13.0.
   CAMetalLayer *layer = (CAMetalLayer *)self.view.layer;
   CGSize tsize             = CGSizeMake(static_cast<int>(size.width * pixelRatio),
                                         static_cast<int>(size.height * pixelRatio));
   layer.drawableSize = tsize;
}

@end
