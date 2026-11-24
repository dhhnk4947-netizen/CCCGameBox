/****************************************************************************
 Copyright (c) 2021-2022 Xiamen Yaji Software Co., Ltd.

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

#include <iostream>

#include "platform/BasePlatform.h"
#include "AppDelegate.h"
#import "ViewController.h"
#import "platform/apple/JsbBridgeWrapper.h"

static void registerOrientationEvents() {
    JsbBridgeWrapper *bridge = [JsbBridgeWrapper sharedInstance];
    [bridge addScriptEventListener:@"setLandscape" listener:^(NSString *arg) {
        dispatch_async(dispatch_get_main_queue(), ^{
            AppDelegate *delegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
            [delegate.viewController setScreenOrientation:UIInterfaceOrientationLandscapeRight];
        });
    }];
    [bridge addScriptEventListener:@"setPortrait" listener:^(NSString *arg) {
        dispatch_async(dispatch_get_main_queue(), ^{
            AppDelegate *delegate = (AppDelegate *)[UIApplication sharedApplication].delegate;
            [delegate.viewController setScreenOrientation:UIInterfaceOrientationPortrait];
        });
    }];
}

int main(int argc, const char * argv[]) {
    cc::BasePlatform* platform = cc::BasePlatform::getPlatform(); 
    if (platform->init()) { 
        return -1;                                                
    }                                                            
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
    registerOrientationEvents();
    platform->run(argc, argv);
    int retVal = UIApplicationMain(argc, (char**)argv, nil, @"AppDelegate");
    [pool release];
    return retVal;
}

