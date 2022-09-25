#### Need to configure the details needed to connect to our vSphere endpoint first.
```
pulumi config set vsphere:allowUnverifiedSsl true
pulumi config set vsphere:password [password] --secret
pulumi config set vsphere:user administrator@vsphere.local
pulumi config set vsphere:vsphere_server vcenter.esxi.lab
```