pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Backend Unit Test') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage ('Frontend Unit Test') {
            steps {
                dir ('frontend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        post {
        success {
            echo '✅ Backend and Frontend Unit Tests Passed'
        }
        failure {
            echo '❌ Backend and Frontend Unit Tests Failed'
        }
    }
        

        stage('SonarQube Scan') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    docker run --rm \
                    -e SONAR_TOKEN=$SONAR_TOKEN \
                    -v $(pwd):/usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=frank-org_fintrust \
                    -Dsonar.organization=frank-org \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=https://sonarcloud.io \
                    '''
                }
            }
        }
    
        success {
            echo '✅ SonarQube Scan Completed Successfully'
        }
        failure {
            echo '❌ SonarQube Scan Failed'
        }
    }
}
