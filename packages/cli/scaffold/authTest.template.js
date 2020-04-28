const test = (z, bundle) => {
  return z.request({
    url: '${ testUrl }',
    ${ extraRequestProps }
  })
}
